import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import './NetworkGraph.css';

const NetworkGraph = ({ nodes, links }) => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!nodes || !links || nodes.length === 0 || !svgRef.current || !containerRef.current) return;

    let width = containerRef.current.clientWidth || 600;
    let height = containerRef.current.clientHeight || 350;

    const renderGraph = () => {
      // Clear previous graph
      d3.select(svgRef.current).selectAll("*").remove();

      const svg = d3.select(svgRef.current)
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height]);

    // Add zoom capabilities
    const zoom = d3.zoom()
      .scaleExtent([0.5, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });
    
    svg.call(zoom);

    const g = svg.append("g");

    // Force simulation
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id).distance(150))
      .force("charge", d3.forceManyBody().strength(-500))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(d => Math.max(10, Math.min(30, Math.sqrt(d.value || 0) / 1.5)) + 20).strength(0.8).iterations(2));

    // Tooltip setup
    const tooltip = d3.select(containerRef.current)
      .append("div")
      .attr("class", "graph-tooltip")
      .style("opacity", 0);

    // Preprocess links for curves
    links.forEach(l => {
      const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
      const targetId = typeof l.target === 'object' ? l.target.id : l.target;
      const key = sourceId < targetId ? `${sourceId}-${targetId}` : `${targetId}-${sourceId}`;
      l.pairKey = key;
    });
    const linkCounts = {};
    links.forEach(l => {
      if (!linkCounts[l.pairKey]) linkCounts[l.pairKey] = 0;
      l.linkIndex = linkCounts[l.pairKey]++;
    });
    links.forEach(l => l.totalLinks = linkCounts[l.pairKey]);

    // Links
    const link = g.append("g")
      .selectAll("path")
      .data(links)
      .join("path")
      .attr("fill", "none")
      .attr("stroke-width", d => {
        if (d.type === 'device') return 4;
        if (d.type === 'payment' || d.type === 'ip') return 2;
        return 1.5;
      })
      .attr("stroke", d => {
        if (d.type === 'device') return '#FF4D4F';
        if (d.type === 'payment' || d.type === 'ip') return '#FAAD14';
        if (d.type === 'address') return '#FADB14';
        return '#6b7280';
      })
      .attr("stroke-dasharray", d => {
        if (d.type === 'address' || d.type === 'product') return "5,5";
        return "none";
      })
      .on("mouseover", (event, d) => {
        tooltip.transition().duration(200).style("opacity", 1);
        tooltip.html(`Connection: <b>${d.type.toUpperCase()}</b>`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", () => {
        tooltip.transition().duration(500).style("opacity", 0);
      });

    // Nodes
    const node = g.append("g")
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", d => Math.max(10, Math.min(30, Math.sqrt(d.value) / 1.5)))
      .attr("fill", d => {
        if (d.score > 70) return '#FF4D4F';
        if (d.score > 30) return '#FAAD14';
        return '#52C41A';
      })
      .attr("stroke", "#0A0C10")
      .attr("stroke-width", 2)
      .call(drag(simulation))
      .on("mouseover", (event, d) => {
        d3.select(event.currentTarget).attr("stroke", "#fff").attr("stroke-width", 3);
        tooltip.transition().duration(200).style("opacity", 1);
        tooltip.html(`
          <div class="font-medium">#${d.id} (${d.name})</div>
          <div class="text-sm text-secondary">${d.product}</div>
          <div class="mono mt-1">₹${d.value?.toLocaleString()}</div>
        `)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", (event) => {
        d3.select(event.currentTarget).attr("stroke", "#0A0C10").attr("stroke-width", 2);
        tooltip.transition().duration(500).style("opacity", 0);
      });

    // Node Labels
    const labels = g.append("g")
      .selectAll("text")
      .data(nodes)
      .join("text")
      .text(d => '#' + d.id)
      .attr("font-size", "10px")
      .attr("font-weight", "bold")
      .attr("fill", "#fff")
      .attr("text-anchor", "middle")
      .attr("dy", d => Math.max(10, Math.min(30, Math.sqrt(d.value || 0) / 1.5)) + 12)
      .style("pointer-events", "none")
      .style("text-shadow", "0px 1px 3px rgba(0,0,0,0.8)");

    simulation.on("tick", () => {
      link.attr("d", d => {
        const dx = d.target.x - d.source.x;
        const dy = d.target.y - d.source.y;
        const dr = Math.sqrt(dx * dx + dy * dy);
        
        if (d.totalLinks === 1) {
          return `M${d.source.x},${d.source.y}L${d.target.x},${d.target.y}`;
        }
        
        // Curve them away from each other
        const sweep = d.linkIndex % 2 === 0 ? 1 : 0;
        const curveDr = dr * (0.8 + Math.floor(d.linkIndex / 2) * 0.4);
        
        return `M${d.source.x},${d.source.y}A${curveDr},${curveDr} 0 0,${sweep} ${d.target.x},${d.target.y}`;
      });

      node
        .attr("cx", d => Math.max(20, Math.min(width - 20, d.x)))
        .attr("cy", d => Math.max(20, Math.min(height - 20, d.y)));

      labels
        .attr("x", d => Math.max(20, Math.min(width - 20, d.x)))
        .attr("y", d => Math.max(20, Math.min(height - 20, d.y)));
    });

    // Drag function
    function drag(simulation) {
      function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }
      function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }
      function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }
      return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    }
    }; // end renderGraph

    // Initial render
    renderGraph();

    // Resize observer
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
          width = entry.contentRect.width;
          height = entry.contentRect.height;
          renderGraph();
        }
      }
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      d3.select(containerRef.current).selectAll(".graph-tooltip").remove();
    };
  }, [nodes, links]);

  return (
    <div className="network-graph-container" ref={containerRef}>
      <svg ref={svgRef} className="network-svg"></svg>
    </div>
  );
};

export default NetworkGraph;
